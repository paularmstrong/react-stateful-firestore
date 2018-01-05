import { getCollectionQueryPath, getQueryId } from '../query';

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

  // TODO: add tests
  describe('getQueryPath', () => {
    test('does a thing', () => {});
  });
});
