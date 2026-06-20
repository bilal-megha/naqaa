/**
 * @file tests/constants.test.js
 * @description اختبارات وحدة لدوال constants.js (hashPwd بشكل أساسي)
 */
import { describe, it, expect } from 'vitest'
import { hashPwd, SECTIONS, ALL_PERMISSIONS, NAV_GROUPS } from '../constants.js'

describe('hashPwd', () => {
  it('يُنتج نفس الـ hash لنفس كلمة المرور دائماً', () => {
    expect(hashPwd('123456')).toBe(hashPwd('123456'))
  })

  it('يُنتج hash مختلف لكلمات مرور مختلفة', () => {
    expect(hashPwd('123456')).not.toBe(hashPwd('654321'))
  })

  it('لا يُرجع كلمة المرور كما هي (نص صريح)', () => {
    expect(hashPwd('admin123')).not.toBe('admin123')
  })
})

describe('SECTIONS', () => {
  it('كل قسم يحتوي على id و icon و label و perm', () => {
    SECTIONS.forEach(s => {
      expect(s).toHaveProperty('id')
      expect(s).toHaveProperty('icon')
      expect(s).toHaveProperty('label')
      expect(s).toHaveProperty('perm')
    })
  })

  it('لا توجد أقسام بمعرّفات (id) مكرّرة', () => {
    const ids = SECTIONS.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('NAV_GROUPS', () => {
  it('كل عنصر تنقل داخل المجموعات موجود فعلاً في SECTIONS', () => {
    const sectionIds = SECTIONS.map(s => s.id)
    NAV_GROUPS.forEach(group => {
      group.items.forEach(itemId => {
        expect(sectionIds).toContain(itemId)
      })
    })
  })
})

describe('ALL_PERMISSIONS', () => {
  it('كل صلاحية تحتوي على actions كمصفوفة غير فارغة', () => {
    ALL_PERMISSIONS.forEach(p => {
      expect(Array.isArray(p.actions)).toBe(true)
      expect(p.actions.length).toBeGreaterThan(0)
    })
  })
})
