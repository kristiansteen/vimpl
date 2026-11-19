import { sanitizePreferences, mergePreferences, MAX_CUSTOM_NODES } from '../preferences.policy';

describe('sanitizePreferences', () => {
  it('keeps known keys with valid values', () => {
    const p = sanitizePreferences({
      preferredLang: 'da',
      taxonomySource: 'custom',
      customTaxonomyName: 'Our processes',
      customTaxonomy: [{ id: '1', name: 'Sales', level: 1, parentId: null }],
    });
    expect(p).toEqual({
      preferredLang: 'da',
      taxonomySource: 'custom',
      customTaxonomyName: 'Our processes',
      customTaxonomy: [{ id: '1', name: 'Sales', level: 1, parentId: null }],
    });
  });

  it('drops unknown keys and invalid values', () => {
    expect(sanitizePreferences({ preferredLang: 'fr', taxonomySource: 'x', isAdmin: true, other: 1 })).toEqual({});
  });

  it('cleans taxonomy nodes and drops malformed ones', () => {
    const p = sanitizePreferences({
      customTaxonomy: [
        { id: '1', name: 'A', level: 1, parentId: null, extra: 'x' },
        { id: '', name: 'no id', level: 1 },
        { id: '2', name: 'bad level', level: 9 },
        'nope',
      ],
    });
    expect(p.customTaxonomy).toEqual([{ id: '1', name: 'A', level: 1, parentId: null }]);
  });

  it('rejects an oversized taxonomy', () => {
    const big = Array.from({ length: MAX_CUSTOM_NODES + 1 }, (_, i) => ({ id: `${i}`, name: 'n', level: 1, parentId: null }));
    expect(() => sanitizePreferences({ customTaxonomy: big })).toThrow(/too many/i);
  });

  it('null clears a key', () => {
    expect(sanitizePreferences({ customTaxonomy: null, customTaxonomyName: null })).toEqual({ customTaxonomy: null, customTaxonomyName: null });
  });
});

describe('mergePreferences', () => {
  it('patches over what is stored and removes cleared keys', () => {
    expect(mergePreferences({ preferredLang: 'en', customTaxonomyName: 'Old' }, { preferredLang: 'da', customTaxonomyName: null }))
      .toEqual({ preferredLang: 'da' });
  });
  it('treats a stored non-object as empty', () => {
    expect(mergePreferences('junk' as unknown, { preferredLang: 'en' })).toEqual({ preferredLang: 'en' });
  });
});
