import { describe, expect, it } from "vitest";

import { getFlatDependencyOptions } from "../dependency-options";
import { createField } from "../factories";

describe("getFlatDependencyOptions", () => {
  it("keeps object fields scoped at the current level", () => {
    const object = createField("object");
    object.key = "bug_details";
    object.title = "Bug Details";
    object.children = [createField("string")];
    object.children[0].key = "severity";
    object.children[0].title = "Severity";

    const requestType = createField("enum");
    requestType.key = "request_type";
    requestType.title = "Request Type";

    const options = getFlatDependencyOptions([requestType, object]);

    expect(options.map((option) => option.path)).toEqual(["request_type", "bug_details"]);
  });
});
