#!/usr/bin/env node

const { Command } = require("commander");
const program = new Command();
program.version(require("../package.json").version);

const { postBlobOnchain } = require("./commands");

program
  .command("deploy")
  .requiredOption("-pk, --privateKey <privateKey>", "private key")
  .requiredOption("-src, --src <src>", "upload file path")
  .requiredOption("-state, --state <state>", "upload file path")
  .option("-r, --rpc <rpc>", "provider RPC url")
  .action((options, command) => {
    postBlobOnchain(
      options.privateKey,
      options.src,
      options.state,
      options.rpc,
    );
  });

program.parse(process.argv);
