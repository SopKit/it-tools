import { describe, expect, it } from 'vitest';
import { diff } from './json-diff.models';

describe('json-diff models', () => {
  describe('diff', () => {
    it('list object differences', () => {
      const obj = { a: 1, b: 2 };
      const newObj = { a: 1, b: 2, c: 3 };
      const result = diff(obj, newObj);

      expect(result).toEqual({
        key: '',
        type: 'object',
        children: [
          {
            key: 'a',
            type: 'value',
            value: 1,
            oldValue: 1,
            status: 'unchanged',
          },
          {
            key: 'b',
            type: 'value',
            value: 2,
            oldValue: 2,
            status: 'unchanged',
          },
          {
            key: 'c',
            type: 'value',
            value: 3,
            oldValue: undefined,
            status: 'added',
          },
        ],
        oldValue: { a: 1, b: 2 },
        value: { a: 1, b: 2, c: 3 },
        status: 'children-updated',
      });
    });

    it('list array differences', () => {
      const obj = [1, 2];
      const newObj = [1, 2, 3];
      const result = diff(obj, newObj);

      expect(result).toEqual({
        key: '',
        type: 'array',
        children: [
          {
            key: 0,
            type: 'value',
            value: 1,
            oldValue: 1,
            status: 'unchanged',
          },
          {
            key: 1,
            type: 'value',
            value: 2,
            oldValue: 2,
            status: 'unchanged',
          },
          {
            key: 2,
            type: 'value',
            value: 3,
            oldValue: undefined,
            status: 'added',
          },
        ],
        oldValue: [1, 2],
        value: [1, 2, 3],
        status: 'children-updated',
      });
    });

    it('lists removed array elements instead of dropping them', () => {
      const result = diff({ items: [1, 2] }, {});

      expect(result).toEqual({
        key: '',
        type: 'object',
        children: [
          {
            key: 'items',
            type: 'array',
            children: [
              {
                key: 0,
                type: 'value',
                oldValue: 1,
                value: undefined,
                status: 'removed',
              },
              {
                key: 1,
                type: 'value',
                oldValue: 2,
                value: undefined,
                status: 'removed',
              },
            ],
            oldValue: [1, 2],
            value: undefined,
            status: 'removed',
          },
        ],
        oldValue: { items: [1, 2] },
        value: {},
        status: 'children-updated',
      });
    });

    it('handles arrays and objects replaced by primitives or null', () => {
      const result = diff({ list: [1, 2], meta: { a: 1 } }, { list: null, meta: 'str' });

      expect(result).toEqual({
        key: '',
        type: 'object',
        children: [
          {
            key: 'list',
            type: 'value',
            oldValue: [1, 2],
            value: null,
            status: 'updated',
          },
          {
            key: 'meta',
            type: 'value',
            oldValue: { a: 1 },
            value: 'str',
            status: 'updated',
          },
        ],
        oldValue: { list: [1, 2], meta: { a: 1 } },
        value: { list: null, meta: 'str' },
        status: 'children-updated',
      });
    });

    it('recursively expands added nested objects and arrays', () => {
      const result = diff({}, { nested: { x: 1 }, tags: ['a'] });

      expect(result).toEqual({
        key: '',
        type: 'object',
        children: [
          {
            key: 'nested',
            type: 'object',
            children: [
              {
                key: 'x',
                type: 'value',
                oldValue: undefined,
                value: 1,
                status: 'added',
              },
            ],
            oldValue: undefined,
            value: { x: 1 },
            status: 'added',
          },
          {
            key: 'tags',
            type: 'array',
            children: [
              {
                key: 0,
                type: 'value',
                oldValue: undefined,
                value: 'a',
                status: 'added',
              },
            ],
            oldValue: undefined,
            value: ['a'],
            status: 'added',
          },
        ],
        oldValue: {},
        value: { nested: { x: 1 }, tags: ['a'] },
        status: 'children-updated',
      });
    });
  });
});
