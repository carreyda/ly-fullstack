/**
 * 服务健康检查结果
 */
export interface HealthStatus {
  /**
   * 健康状态
   *
   * 当前只有 `ok` 表示服务进程已启动并能响应请求。
   */
  status: 'ok';

  /**
   * 返回健康状态的服务名称
   */
  service: string;

  /**
   * 服务生成健康检查结果的 ISO 时间
   */
  timestamp: string;
}
