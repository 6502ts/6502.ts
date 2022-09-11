module.exports = {
    swDest: 'dist/stellerator/service-worker.js',
    globDirectory: 'dist/stellerator',
    globPatterns: ['**/*'],
    globIgnores: ['**/*.map', '**/doc/images/orig/**'],
    cacheId: 'stellerator-ng',
    skipWaiting: true,
    clientsClaim: true,
};
