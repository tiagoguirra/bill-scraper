module.exports = {
  apps: [
    {
      name: 'bill-scraper',
      script: 'src/server.ts',
      interpreter: 'node',
      interpreter_args: '-r ts-node/register',
      watch: false,
      env_file: '.env',
    },
  ],
};
