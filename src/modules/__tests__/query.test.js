import { getCollectionQueryPath, getDocumentIdsForQuery, getQueryId, getQueryPath } from '../query';

describe('query', () => {
  describe('getQueryId', () => {
    describe('for firebase.firestore.Document', () => {
      test('returns the id if available and equal to the path', () => {
        expect(getQueryId({ id: 'foobar', path: 'foobar' })).toEqual('foobar');
      });

      test('returns the path if it does not match the id', () => {
        expect(getQueryId({ id: 'foobar', path: 'foobar/123' })).toEqual('foobar/123');
      });
    });

    describe('for Collection', () => {
      test('includes filters', () => {
        expect(
          getQueryId({
            _query: {
              filters: [{ field: { segments: ['count'] }, op: { name: '<' }, value: 4 }],
              path: { segments: ['foo', 'bar'] }
            }
          })
        ).toEqual('foo/bar:count<4');
      });
    });
  });

  describe('getCollectionQueryPath', () => {
    test('returns the collection path for a single Document', () => {
      expect(getCollectionQueryPath({ id: 'foo', path: 'foo' })).toEqual('foo');
      expect(getCollectionQueryPath({ id: 'foo', path: 'foo/123' })).toEqual('foo');
      expect(getCollectionQueryPath({ id: 'foo/123/bar', path: 'foo/123/bar' })).toEqual('foo/123/bar');
      expect(getCollectionQueryPath({ id: 'foo/123/bar', path: 'foo/123/bar/456' })).toEqual('foo/123/bar');
    });
  });

  describe('getQueryPath', () => {
    test('returns the path for simple queries', () => {
      expect(getQueryPath({ path: 'foo' })).toEqual('foo');
    });

    test('pieces together segments for complex queries', () => {
      expect(getQueryPath({ _query: { path: { segments: ['foo', '123', 'bar'] } } })).toEqual('foo/123/bar');
    });
  });

  describe('getDocumentIdsForQuery', () => {
    test('finds the document ids from state for simple queries', () => {
      expect(
        getDocumentIdsForQuery(
          { path: 'foo/123' },
          { collections: { foo: { '123': { id: '123' }, '456': { id: '456' } } } }
        )
      ).toEqual(['123']);
    });

    test('applies filters to documents for complex queries', () => {
      expect(
        getDocumentIdsForQuery(
          {
            _query: {
              path: { segments: ['foo'] },
              filters: [{ field: { segments: ['count'] }, op: { name: '<' }, value: { internalValue: 4 } }],
              limit: null
            }
          },
          {
            collections: {
              foo: { '123': { id: '123', count: 5 }, '456': { id: '456', count: 3 }, '789': { id: '789', count: 0 } }
            }
          }
        )
      ).toEqual(['456', '789']);

      expect(
        getDocumentIdsForQuery(
          {
            _query: {
              path: { segments: ['foo'] },
              filters: [
                {
                  field: { segments: ['date'] },
                  op: { name: '<=' },
                  value: {
                    internalValue: { seconds: 1600000000000 },
                    toString() {
                      return new Date(1600000000000).toString();
                    }
                  }
                },
                { field: { segments: ['b'] }, op: { name: '==' }, value: { internalValue: 4 } }
              ],
              limit: 2
            }
          },
          {
            collections: {
              foo: {
                '123': { id: '123', b: 3, date: new Date(1500000000000) },
                '456': { id: '456', b: 4, date: new Date(1600000000000) },
                '789': { id: '789', b: 2, date: new Date(1700000000000) }
              }
            }
          }
        )
      ).toEqual(['456']);
    });
  });
});
