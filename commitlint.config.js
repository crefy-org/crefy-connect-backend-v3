module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            [
                'feat', // New feature
                'fix', // Bug fix
                'docs', // Documentation
                'style', // Formatting, missing semi colons, etc.
                'refactor', // Code refactoring
                'test', // Adding tests
                'chore', // Maintenance tasks
                'ci', // CI related changes
                'perf', // Performance improvements
                'revert', // Revert previous commit
                'wip', // Work in progress
            ],
        ],
        'subject-case': [
            2,
            'never',
            ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
        ],
        'subject-max-length': [2, 'always', 72],
        'body-max-line-length': [2, 'always', 100],
        'footer-max-line-length': [2, 'always', 100],
    },
};
