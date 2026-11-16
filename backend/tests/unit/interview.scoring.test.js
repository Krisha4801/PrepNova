const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { isLowEffortAnswer } = require("../../src/services/questionBank.service");

describe("Interview answer quality detection", () => {
  it("recognizes explicit non-answers even with punctuation", () => {
    assert.equal(isLowEffortAnswer("idk.", 1), true);
    assert.equal(isLowEffortAnswer("I don't know.", 3), true);
    assert.equal(isLowEffortAnswer("not sure!", 2), true);
  });

  it("does not classify a substantive answer as low effort", () => {
    assert.equal(isLowEffortAnswer("The browser builds a render tree before layout.", 8), false);
  });
});
