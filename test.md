const tree = {
    myproject: {
        directory: {
            'foo.js': {
                file: {
                    contents: 'const x = 1;',
                },
            },
            'bar.js': {
                file: {
                    symlink: './foo.js',
                },
            },
            '.envrc': {
                file: {
                    contents: 'ENVIRONMENT=staging'
                }
            },
        },
    },
    emptyFolder: {
        directory: {}
    },
};