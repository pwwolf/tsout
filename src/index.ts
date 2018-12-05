type scope = string; // e.g. 'default'
type classIdentifier = Function; // constructor

// value is the current value of the field being serialized,
// and obj is the object being serialized
type serializeFunction = (value: any, obj: any) => any;

//Map a scope to the fields that make up that scope
type ScopeFieldMap = Map<
  scope,
  Map<
    string | symbol,
    {
      serializer?: serializeFunction;
      name?: string;
    }
  >
>;

type ResponseOptions = {
  scope?: string | string[];
  serializer?: serializeFunction;
  name?: string; //name of serialized field
};

//This is where we store all the decorator data in the system
//TODO: better place to keep this?
let responseFieldRegistry: Map<classIdentifier, ScopeFieldMap> = new Map();

//Decorator factory
export function out(
  options: ResponseOptions = {
    scope: "default"
  }
): PropertyDecorator {
  // this is the decorator factory
  return (target: Object, propertyKey: string | symbol) => {
    let className = target.constructor;
    if (!responseFieldRegistry.has(className)) {
      responseFieldRegistry.set(className, new Map());
    }

    let scopeFieldMap = responseFieldRegistry.get(className)!;
    let scopesToCheck: string[] = [];
    if (!options.scope) {
      //Default to 'default' scope
      scopesToCheck.push("default");
    } else if (options.scope instanceof Array) {
      scopesToCheck = [...scopesToCheck, ...options.scope];
    } else if (typeof options.scope === "string") {
      scopesToCheck.push(options.scope);
    }

    for (let scope of scopesToCheck) {
      if (!scopeFieldMap.has(scope)) {
        scopeFieldMap.set(scope, new Map());
      }

      let fields = scopeFieldMap.get(scope)!;
      fields.set(propertyKey, {
        serializer: options.serializer,
        name: options.name
      });
    }
  };
}

export function toJson(
  target: any | undefined,
  scope: string | string[] = "default"
): any {
  if (typeof target === "undefined") {
    return undefined;
  }

  if (isPrimitive(target)) {
    return target;
  }

  if (target instanceof Date) {
    return target.toISOString();
  }

  if (Array.isArray(target)) {
    let array: any[] = target;
    return array.map(element => toJson(element));
  }

  let resp: { [key: string]: any } = {};

  let className = target.constructor;

  if (className.name === "Object") {
    //basic JS object, no class name
    return target;
  }

  if (!responseFieldRegistry.has(className)) {
    console.warn(`${className.name} does not have any response fields`);
    //return original object
    return {}; //is this sensible?
  }

  let scopesToGet: string[] = [];
  if (scope instanceof Array) {
    scopesToGet = scope;
  } else {
    scopesToGet = [scope];
  }

  //Always want default
  if (scopesToGet.indexOf("default") < 0) {
    scopesToGet.push("default");
  }

  for (let scopeToGet of scopesToGet) {
    let fieldSet = responseFieldRegistry.get(className)!.get(scopeToGet);
    if (fieldSet) {
      fieldSet.forEach((options, propName) => {
        if (target.hasOwnProperty(propName)) {
          let value: any = (target as any)[propName];
          let fieldName = options.name || (propName as string);
          if (options.serializer) {
            resp[fieldName] = options.serializer.call(null, value, target);
          } else {
            resp[fieldName] = toJson(value);
          }
        }
      });
    }
  }

  return resp;
}

function isPrimitive(test: any) {
  return test !== Object(test);
}
