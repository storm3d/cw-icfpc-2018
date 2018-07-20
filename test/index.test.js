import {sayHello} from "../dist/index";

test("sayHello", () => {
  expect(sayHello()).toBe("Hello, Haz!");
  expect(sayHello("foo")).toBe("Hello, foo!");
});
