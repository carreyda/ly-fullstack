import { describe, expect, it } from '@rstest/core';

import { resolveMenuIcon } from './menu-icon';
import { MENU_ICON_CATEGORIES, MENU_ICON_OPTIONS } from './menu-icons';

describe('菜单图标注册表', () => {
  it('能够解析白名单图标，并拒绝未知或空名称', () => {
    const houseOption = MENU_ICON_OPTIONS.find((option) => option.name === 'House');

    expect(houseOption).toBeDefined();
    expect(resolveMenuIcon('House')).toBe(houseOption?.component);
    expect(resolveMenuIcon('ArrowLeft')).toBeUndefined();
    expect(resolveMenuIcon(null)).toBeUndefined();
  });

  it('图标名称保持唯一且全部归属于已注册分类', () => {
    const names = MENU_ICON_OPTIONS.map((option) => option.name);
    const categories = new Set(MENU_ICON_CATEGORIES);

    expect(new Set(names).size).toBe(names.length);
    expect(MENU_ICON_OPTIONS.every((option) => categories.has(option.category))).toBe(true);
  });

  it('白名单不包含导航方向类图标', () => {
    expect(MENU_ICON_OPTIONS.map((option) => option.name)).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^(Arrow|Chevron)/)]),
    );
  });
});
