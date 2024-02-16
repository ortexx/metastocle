import node from "../src/node.js";
import tools from "./tools.js";
import database from "./db/database.js";
import loki from "./db/loki.js";
import collection from "./collection/collection.js";
import express from "./server/express.js";

const Node = node();

export default function () {
  describe('services', () => {
    before(async function () {
      this.node = new Node(await tools.createNodeOptions({ server: false }));
      await this.node.init();
    });

    after(async function () {
      await this.node.destroy();
    });

    describe('db', () => {
      describe('database', database.bind(this));
      describe('loki', loki.bind(this));
    });

    describe('collection', () => {
      describe('collection', collection.bind(this));
    });
    
    describe('server', () => {
      describe('express', express.bind(this));
    });
  });
}