module.exports = {
  initLlama: jest.fn(() => Promise.resolve({
    completion: jest.fn(() => Promise.resolve({ text: 'important' })),
  })),
};
