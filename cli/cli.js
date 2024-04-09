#!/usr/bin/env node

const { Command } = require("commander");
const program = new Command();
program.version(require("../package.json").version);

const { postContractBlobOnchain, postInteractionBlobOnchain } = require("./commands");

program
  .command("deploy")
  .requiredOption("-pk, --pk <pk>", "private key")
  .requiredOption("-src, --src <src>", "upload file path")
  .requiredOption("-state, --state <state>", "upload file path")
  .option("-r, --rpc <rpc>", "provider RPC url")
  .action((options, command) => {
    postContractBlobOnchain(
      options.pk,
      options.src,
      options.state,
      options.rpc,
    );
  })

  program
  .command("write")
  .requiredOption("-pk, --pk <pk>", "private key")
  .requiredOption("-ca, --contract <contract>", "target contract address")
  .requiredOption("-input, --input <input>", "interaction inputs")
  .option("-r, --rpc <rpc>", "provider RPC url")
  .action((options, command) => {
    postInteractionBlobOnchain(
      options.pk,
      options.input,
      options.contract,
      options.rpc
    );
  })

program.parse(process.argv);
