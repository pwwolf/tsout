# tsout

This is a TypeScript library intended for serializing TypeScript objects to POJOs.
Decorators are used to control which fields are serialized and how they are serialized.

It shares some similarities to libraries such as [serializr](https://github.com/mobxjs/serializr).

## Use Cases
The specific use case this library was created to solve was to take [TypeORM](https://github.com/typeorm/typeorm) entities
and write them has JSON responses in a REST API.

Some fields on the entity are considered public, and some are only intended to be visible to admin users.
A *scope* can be set on the field to control when that field is serialized.

### Example:

```ts
class MyEntity {

    @out()
    publicField: string;
    
    @out({scope: 'admin'})
    privateField: string;

}

const myEntity = new MyEntity();
myEntity.publicField = "foo";
myEntity.privateField = "bar";

//Serialize to default scope -- skips admin-scoped fields
const result = toJson(myEntity); // {publicField: 'foo'}

```

### Scopes

By default every field belongs to the 'default' scope.
During serialization one or more scopes can be specified

```ts
result = toJson(myEntity, 'admin')
```
or
```ts
result = toJson(myEntity, ['admin', 'audit']);
```

However, default-scoped fields are always included.
The above result would contain admin, audit, and default scoped fields.

Additionally, multiple scopes can be declared in the decorator.

```ts
    @out({scope: ['admin', 'audit']})
    myField: string;
```

### Custom serializers
A custom serializer function can be specified to customize the resulting value.

The function receives to parameters
1. The current value of the field being serialized
2. The object being serialized

```ts
  @out({
    serializer: (val, obj) => {
        return ...
    }
  })
  customSerializer: string;
```
