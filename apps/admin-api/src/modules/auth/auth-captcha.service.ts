import { BadRequestException, Injectable } from '@nestjs/common';
import { randomInt, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

import type { AdminCaptchaResponse } from '@repo/shared/types';

import {
  ADMIN_CAPTCHA_EXPIRES_IN_MS,
  ADMIN_CAPTCHA_IMAGE_HEIGHT,
  ADMIN_CAPTCHA_IMAGE_WIDTH,
  ADMIN_CAPTCHA_MAX_RECORDS,
  ADMIN_CAPTCHA_OFFSET_MAX,
  ADMIN_CAPTCHA_OFFSET_MIN,
  ADMIN_CAPTCHA_PUZZLE_SIZE,
  ADMIN_CAPTCHA_TOLERANCE,
  ADMIN_CAPTCHA_TOP_MAX,
  ADMIN_CAPTCHA_TOP_MIN,
} from '../../constants';
import type { AdminCaptchaRecord } from '../../types';

/**
 * 验证码原图所在目录
 *
 * 路径同时适用 `tsx` 执行的 `src/modules/auth` 和编译后的 `dist/modules/auth`，
 * 因此生产启动不需要把静态图片复制进 `dist`。
 */
const CAPTCHA_IMAGE_DIRECTORY = resolve(__dirname, '../../../assets');

/**
 * 可随机使用的验证码原图文件名
 */
const CAPTCHA_IMAGE_FILENAMES = Array.from({ length: 20 }, (_, index) => `captcha-${index + 1}.jpg`);

/**
 * 拼图轮廓路径
 *
 * 路径占满 56 像素画布，背景缺口和拼图块共用同一轮廓，避免两份绘制逻辑偏移。
 */
const CAPTCHA_PUZZLE_PATH =
  'M6 6H20C19 1 23 0 28 0S37 1 36 6H50V20C55 19 56 23 56 28S55 37 50 36V50H36C37 55 33 56 28 56S19 55 20 50H6V36C1 37 0 33 0 28S1 19 6 20Z';

/**
 * 把 PNG 像素缓冲区转换成浏览器可直接显示的 Data URL
 *
 * @param image PNG 图片缓冲区
 * @returns Base64 编码的 PNG Data URL
 */
const createPngDataUrl = (image: Buffer): string => {
  return `data:image/png;base64,${image.toString('base64')}`;
};

/**
 * 管理端登录图片滑块挑战服务
 *
 * 服务端随机选图、生成缺口和拼图块，且只在进程内保存正确横坐标。浏览器获得的
 * 响应不包含答案，登录时必须提交尚未过期且未消费的挑战编号。
 */
@Injectable()
export class AuthCaptchaService {
  /**
   * 尚未消费的一次性挑战
   */
  private readonly captchaRecords = new Map<string, AdminCaptchaRecord>();

  /**
   * 已通过拼图校验、等待登录接口消费的凭证
   */
  private readonly verifiedCaptchaRecords = new Map<string, AdminCaptchaRecord>();

  /**
   * 创建一次性图片滑块挑战
   *
   * @param exposeTestOffset 是否追加 Playwright 专用的测试偏移
   * @returns 挑战编号、已绘制缺口的背景图和独立拼图块
   */
  async createCaptcha(exposeTestOffset = false): Promise<AdminCaptchaResponse> {
    const now = Date.now();
    this.cleanupExpiredCaptchas(now);
    this.evictOldestCaptchaIfNeeded();

    const captchaId = randomUUID();
    const offset = randomInt(ADMIN_CAPTCHA_OFFSET_MIN, ADMIN_CAPTCHA_OFFSET_MAX + 1);
    const puzzleTop = randomInt(ADMIN_CAPTCHA_TOP_MIN, ADMIN_CAPTCHA_TOP_MAX + 1);
    const sourceImage = await this.readRandomSourceImage();
    const [backgroundImage, puzzleImage] = await Promise.all([
      this.createBackgroundImage(sourceImage, offset, puzzleTop),
      this.createPuzzleImage(sourceImage, offset, puzzleTop),
    ]);

    this.captchaRecords.set(captchaId, { offset, createdAt: now });

    const response: AdminCaptchaResponse & { testOffset?: number } = {
      captchaId,
      backgroundImage: createPngDataUrl(backgroundImage),
      puzzleImage: createPngDataUrl(puzzleImage),
      imageWidth: ADMIN_CAPTCHA_IMAGE_WIDTH,
      imageHeight: ADMIN_CAPTCHA_IMAGE_HEIGHT,
      puzzleSize: ADMIN_CAPTCHA_PUZZLE_SIZE,
      puzzleTop,
    };

    /**
     * Playwright 需要稳定完成真实拖动，避免把验证码本身变成不可回归的黑盒。
     * 是否处于非生产环境以及请求是否带有测试标记由 Controller 判断，生产请求不得
     * 把 `exposeTestOffset` 设为 true。
     */
    if (exposeTestOffset) {
      response.testOffset = offset;
    }

    return response;
  }

  /**
   * 校验并消费一次性挑战
   *
   * 记录在判断结果前就会删除，因此无论成功、位置错误还是过期都无法重放。
   *
   * @param captchaId 客户端提交的挑战编号
   * @param offset 用户实际拖动的横向偏移量
   * @throws 挑战不存在、过期或者位置超出容差时抛出 400
   */
  verifyCaptcha(captchaId: string, offset: number): void {
    const record = this.captchaRecords.get(captchaId);
    this.captchaRecords.delete(captchaId);

    if (!record || Date.now() - record.createdAt > ADMIN_CAPTCHA_EXPIRES_IN_MS) {
      throw new BadRequestException('滑块验证已过期，请重新验证');
    }

    if (Math.abs(record.offset - offset) > ADMIN_CAPTCHA_TOLERANCE) {
      throw new BadRequestException('滑块验证失败，请重试');
    }

    this.evictOldestVerifiedCaptchaIfNeeded();
    this.verifiedCaptchaRecords.set(captchaId, { offset: record.offset, createdAt: Date.now() });
  }

  /**
   * 校验并消费已通过拼图校验的登录凭证
   *
   * @param captchaId 登录请求提交的挑战编号
   * @throws 凭证未验证、已消费或已过期时抛出 400
   */
  consumeVerifiedCaptcha(captchaId: string): void {
    const record = this.verifiedCaptchaRecords.get(captchaId);
    this.verifiedCaptchaRecords.delete(captchaId);

    if (!record || Date.now() - record.createdAt > ADMIN_CAPTCHA_EXPIRES_IN_MS) {
      throw new BadRequestException('滑块验证已失效，请重新验证');
    }
  }

  /**
   * 读取一张随机验证码原图
   *
   * @returns 已按验证区域尺寸裁切的 JPEG 像素缓冲区
   */
  private async readRandomSourceImage(): Promise<Buffer> {
    const imageIndex = randomInt(0, CAPTCHA_IMAGE_FILENAMES.length);
    const filename = CAPTCHA_IMAGE_FILENAMES[imageIndex] ?? CAPTCHA_IMAGE_FILENAMES[0];
    return sharp(readFileSync(resolve(CAPTCHA_IMAGE_DIRECTORY, filename)))
      .resize(ADMIN_CAPTCHA_IMAGE_WIDTH, ADMIN_CAPTCHA_IMAGE_HEIGHT, { fit: 'cover' })
      .jpeg({ quality: 84 })
      .toBuffer();
  }

  /**
   * 绘制带拼图缺口的背景图
   *
   * @param sourceImage 已归一化尺寸的 JPEG 像素缓冲区
   * @param offset 缺口横坐标
   * @param puzzleTop 缺口纵坐标
   * @returns 已绘制缺口的 PNG 像素缓冲区
   */
  private createBackgroundImage(sourceImage: Buffer, offset: number, puzzleTop: number): Promise<Buffer> {
    const hole = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${ADMIN_CAPTCHA_PUZZLE_SIZE}" height="${ADMIN_CAPTCHA_PUZZLE_SIZE}" viewBox="0 0 ${ADMIN_CAPTCHA_PUZZLE_SIZE} ${ADMIN_CAPTCHA_PUZZLE_SIZE}"><path d="${CAPTCHA_PUZZLE_PATH}" fill="rgba(5,7,6,.52)" stroke="rgba(255,255,255,.92)" stroke-width="2"/></svg>`,
    );

    return sharp(sourceImage)
      .composite([{ input: hole, left: offset, top: puzzleTop }])
      .png()
      .toBuffer();
  }

  /**
   * 从原图相同坐标裁出带透明轮廓的拼图块
   *
   * @param sourceImage 已归一化尺寸的 JPEG 像素缓冲区
   * @param offset 拼图块原始横坐标
   * @param puzzleTop 拼图块原始纵坐标
   * @returns 带透明拼图轮廓的 PNG 像素缓冲区
   */
  private createPuzzleImage(sourceImage: Buffer, offset: number, puzzleTop: number): Promise<Buffer> {
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${ADMIN_CAPTCHA_PUZZLE_SIZE}" height="${ADMIN_CAPTCHA_PUZZLE_SIZE}" viewBox="0 0 ${ADMIN_CAPTCHA_PUZZLE_SIZE} ${ADMIN_CAPTCHA_PUZZLE_SIZE}"><path d="${CAPTCHA_PUZZLE_PATH}" fill="white"/></svg>`,
    );
    const outline = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${ADMIN_CAPTCHA_PUZZLE_SIZE}" height="${ADMIN_CAPTCHA_PUZZLE_SIZE}" viewBox="0 0 ${ADMIN_CAPTCHA_PUZZLE_SIZE} ${ADMIN_CAPTCHA_PUZZLE_SIZE}"><path d="${CAPTCHA_PUZZLE_PATH}" fill="none" stroke="rgba(255,255,255,.96)" stroke-width="2"/></svg>`,
    );

    return sharp(sourceImage)
      .extract({
        left: offset,
        top: puzzleTop,
        width: ADMIN_CAPTCHA_PUZZLE_SIZE,
        height: ADMIN_CAPTCHA_PUZZLE_SIZE,
      })
      .ensureAlpha()
      .composite([
        { input: mask, blend: 'dest-in' },
        { input: outline, blend: 'over' },
      ])
      .png()
      .toBuffer();
  }

  /**
   * 达到容量上限时淘汰最早创建的挑战
   */
  private evictOldestCaptchaIfNeeded(): void {
    if (this.captchaRecords.size < ADMIN_CAPTCHA_MAX_RECORDS) {
      return;
    }

    const oldestCaptchaId = this.captchaRecords.keys().next().value;
    if (oldestCaptchaId) {
      this.captchaRecords.delete(oldestCaptchaId);
    }
  }

  /**
   * 达到容量上限时淘汰最早通过校验但尚未登录的凭证
   */
  private evictOldestVerifiedCaptchaIfNeeded(): void {
    if (this.verifiedCaptchaRecords.size < ADMIN_CAPTCHA_MAX_RECORDS) {
      return;
    }

    const oldestCaptchaId = this.verifiedCaptchaRecords.keys().next().value;
    if (oldestCaptchaId) {
      this.verifiedCaptchaRecords.delete(oldestCaptchaId);
    }
  }

  /**
   * 惰性清理已过期但尚未提交的挑战
   *
   * @param now 当前时间戳，单次清理共用同一基准时间
   */
  private cleanupExpiredCaptchas(now: number): void {
    for (const [captchaId, record] of this.captchaRecords) {
      if (now - record.createdAt > ADMIN_CAPTCHA_EXPIRES_IN_MS) {
        this.captchaRecords.delete(captchaId);
      }
    }

    for (const [captchaId, record] of this.verifiedCaptchaRecords) {
      if (now - record.createdAt > ADMIN_CAPTCHA_EXPIRES_IN_MS) {
        this.verifiedCaptchaRecords.delete(captchaId);
      }
    }
  }
}
