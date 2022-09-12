module.exports = {
    swDest: 'dist/stellerator-ng/service-worker.js',
    globDirectory: 'dist/stellerator-ng',
    globPatterns: ['**/*'],
    globIgnores: ['**/*.map', '**/doc/images/orig/**'],
    cacheId: 'stellerator-ng',
    skipWaiting: true,
    clientsClaim: true,
};
