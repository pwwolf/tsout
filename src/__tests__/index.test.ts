import { out, toJson } from "../index";

class BasicClass {
  constructor() {
    this.boolField = true;
    this.stringField = "hello";
    this.dateField = new Date();
    this.nonSerializedField = "blah";
    this.arrayPrimitiveField = ["a", "b", "c"];
    this.objectField = {
      a: true
    };
    this.adminField = "admin";
    this.customSerializer = "custom";
    this.multiField = "multi";
    this.auditField = "audit";
    this.nestedClass = new NestedClass();
    this.customFieldName = "customField";
  }

  @out()
  boolField: boolean;

  @out()
  stringField: string;

  @out()
  dateField: Date;

  @out()
  arrayPrimitiveField: string[];

  nonSerializedField: string;

  @out()
  objectField: any;

  @out({ scope: "admin" })
  adminField: string;

  @out({ scope: "audit" })
  auditField: string;

  @out({ scope: ["admin", "audit"] })
  multiField: string;

  @out({
    serializer: (val, obj) => {
      return val + "." + obj.customSerializer;
    }
  })
  customSerializer: string;

  @out()
  nestedClass: NestedClass;

  @out({ name: "testCustomFieldName" })
  customFieldName: string;
}

class NestedClass {
  constructor() {
    this.field1 = "field1";
  }

  @out()
  field1: string;
}

test("Basic class", () => {
  let basicClass = new BasicClass();
  let result = toJson(basicClass);
  expect(result.boolField).toBe(true);
  expect(result.stringField).toBe("hello");
  expect(result.dateField).toBe(basicClass.dateField.toISOString());
  expect(result.nonSerializedField).toBeUndefined();
  expect(result.arrayPrimitiveField).toEqual(["a", "b", "c"]);
  expect(result.objectField).toEqual({ a: true });
  expect(result.adminField).toBeUndefined();
  expect(result.customSerializer).toBe("custom.custom");
  expect(result.testCustomFieldName).toBe("customField");
  expect(result.nestedClass).toEqual({ field1: "field1" });
  expect(result.adminField).toBeUndefined();
  expect(result.multiField).toBeUndefined();

  //Test different scopes
  let adminFields = toJson(basicClass, "admin");
  expect(adminFields.adminField).toBe("admin");
  expect(adminFields.multiField).toBe("multi");
  expect(adminFields.auditField).toBeUndefined();

  //We should still get default fields
  expect(adminFields.boolField).toBe(true);

  let auditFields = toJson(basicClass, "audit");
  expect(auditFields.adminField).toBeUndefined();
  expect(auditFields.auditField).toBe("audit");
  expect(auditFields.multiField).toBe("multi");

  //Test multi scopes
  let multiFields = toJson(basicClass, ["audit", "admin"]);
  expect(multiFields.auditField).toBe("audit");
  expect(multiFields.multiField).toBe("multi");
  expect(multiFields.adminField).toBe("admin");
});
