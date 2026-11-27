import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import CSelect from './c-select.vue';

describe('CSelect', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders ARIA combobox and listbox semantics and selects an option on click', async () => {
    const wrapper = mount(CSelect, {
      props: {
        options: ['Alpha', 'Beta', 'Gamma'],
        placeholder: 'Pick one',
      },
    });

    const trigger = wrapper.get('[role="combobox"]');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(trigger.attributes('aria-haspopup')).toBe('listbox');

    await trigger.trigger('click');
    expect(trigger.attributes('aria-expanded')).toBe('true');

    const listbox = wrapper.get('[role="listbox"]');
    const options = listbox.findAll('[role="option"]');
    expect(options).toHaveLength(3);

    await options[1].trigger('click');
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['Beta']);
    expect(trigger.attributes('aria-expanded')).toBe('false');
  });

  it('does not crash when pressing ArrowDown and Enter with zero filtered results', async () => {
    const wrapper = mount(CSelect, {
      props: {
        options: ['Apple', 'Banana', 'Cherry'],
        searchable: true,
      },
    });

    const trigger = wrapper.get('[role="combobox"]');
    await trigger.trigger('click');

    const input = wrapper.get('input.search-input');
    await input.setValue('zzzzz');
    expect(wrapper.findAll('[role="option"]')).toHaveLength(0);

    await trigger.trigger('keydown', { key: 'ArrowDown' });
    await trigger.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('update:value')).toBeUndefined();
    expect(trigger.attributes('aria-expanded')).toBe('true');
  });

  it('clamps ArrowDown navigation to the filtered options length', async () => {
    const wrapper = mount(CSelect, {
      props: {
        options: ['Apple', 'Apricot', 'Banana', 'Cherry'],
        searchable: true,
      },
    });

    const trigger = wrapper.get('[role="combobox"]');
    await trigger.trigger('click');

    const input = wrapper.get('input.search-input');
    await input.setValue('Ap');

    const filtered = wrapper.findAll('[role="option"]');
    expect(filtered).toHaveLength(2);

    await trigger.trigger('keydown', { key: 'ArrowDown' });
    await trigger.trigger('keydown', { key: 'ArrowDown' });
    await trigger.trigger('keydown', { key: 'ArrowDown' });
    await trigger.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('update:value')?.[0]).toEqual(['Apricot']);
  });

  it('reacts to dynamic options prop updates', async () => {
    const wrapper = mount(CSelect, {
      props: {
        options: ['One', 'Two'],
        searchable: true,
      },
    });

    await wrapper.setProps({ options: ['Three', 'Four', 'Five'] });
    await wrapper.get('[role="combobox"]').trigger('click');

    const renderedLabels = wrapper.findAll('[role="option"]').map(node => node.text());
    expect(renderedLabels).toEqual(['Three', 'Four', 'Five']);
  });
});
