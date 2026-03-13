import { describe, expect, it } from "vitest";

import { getFlatDependencyOptions } from "../dependency-options";
import { createField } from "../factories";

describe("getFlatDependencyOptions", () => {
  it("flattens section children into the current scope but keeps object children scoped", () => {
    const section = createField("section");
    section.title = "Contact";
    section.children = [createField("string")];
    section.children[0].key = "full_name";
    section.children[0].title = "Full Name";

    const object = createField("object");
    object.key = "bug_details";
    object.title = "Bug Details";
    object.children = [createField("string")];
    object.children[0].key = "severity";
    object.children[0].title = "Severity";

    const requestType = createField("enum");
    requestType.key = "request_type";
    requestType.title = "Request Type";

    const options = getFlatDependencyOptions([section, requestType, object]);

    expect(options.map((option) => option.path)).toEqual(["full_name", "request_type", "bug_details"]);
  });
});
