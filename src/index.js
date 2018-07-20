// @flow

import { readModel } from "./model/reader"

/**
 * This function says hello.
 * @param name Some name to say hello for.
 * @returns The hello.
 */
const sayHello = (name = "Haz") => `Hello, ${name}!`;

sayHello();

module.exports = {
  sayHello
}

readModel('./problemsL/LA001_tgt.mdl')