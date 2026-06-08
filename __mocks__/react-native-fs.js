module.exports = {
  DocumentDirectoryPath: '/mock/path',
  exists: jest.fn(() => Promise.resolve(true)),
  stat: jest.fn(() => Promise.resolve({ size: '100000000' })),
};
