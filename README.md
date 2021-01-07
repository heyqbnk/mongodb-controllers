# MongoDB controllers
MongoDB TypeScript controllers with soft deletion mode and timestamps.

## Installation
```bash
npm i @kibcode/mongodb-controllers
```
or
```bash
yarn add @kibcode/mongodb-controllers
```

## Description
The main purpose of this library is to provide the lowest (almost) control
over documents placed in MongoDB. So, provided functionality is
an additional layer over standard `mongodb` package which has its own
useful modifications such as an ability to use soft deletion and
ability to use creation and update timestamps.

## Usage
Firstly, you have to install `mongodb` package.

```bash
npm i mongodb
```
or
```bash
yarn add mongodb
```

### Controller
All controllers you create should extend library's `Controller` class.
This is how it should look like:

```typescript
import {Controller} from '@kibcode/mongodb-controllers';
import {ObjectId, Collection} from 'mongodb';

interface IUser {
  _id: ObjectId;
  name: string;
}

// Lets imagine, we got this collection somehow. You should not use
// "null as any" as it is shown just as an example.
// Originally, you have to create MongoDB Client and then fork
// database. Finally, fork collection from created database and use 
// it.
const usersCollection: Collection<IUser> = null as any;

// In case, you want to create controller with your own
// functionality, call "Controller" function which returns
// class with static methods and extend it.
class UsersController extends Controller(usersCollection) { }

// Otherwise you could use more simple way.
const UsersController = Controller(usersCollection);
```

When controller is created, we can use its methods.

```typescript
UsersController
  .findOne({name: 'Vladislav Kibenko'})
  .then(user => {
    if (user === null) {
      console.log('Unable to find user :(')
    } else {
      console.log('User was found!', user);
    }
  });
```

#### Soft deletion mode

> Soft deletion assumes addition of such field as `deletedAt` instead of
> physical deletion of entity.

While creating new controller, it is allowed to enable soft deletion mode
for it. This mode is useful when you are afraid of losing some
data without availability to recover it. 

How does soft deletion mode influence controller workflow?

1. Entities cannot be deleted until you explicitly do it. It means, when 
`deleteOne` or `deleteMany` are called, found entities are not being physically
deleted. They just get `deletedAt` field which is equal to current 
timestamp.
2. Entities with existing field `deletedAt` cannot be found with
`find`, `findOne` etc. until you pass property 
`includeDeleted = true` while searching for them.

##### Enabling soft deletion mode
```typescript
import {Controller} from '@kibcode/mongodb-controllers';
import {ObjectId, Collection} from 'mongodb';

// Pay attention to this interface. As you use soft deletion mode,
// it should contain property deletedAt?: Date. There will be no
// errors thrown due to useSoftDelete requires optional field but
// make sure you have added it.
interface IUser {
  _id: ObjectId;
  name: string;
  deletedAt?: Date;
}

// ...

// Pass useSoftDelete = true to enable soft deletion mode.
class UsersController extends Controller({
  collection: usersCollection,
  useSoftDelete: true,
}) { }

(async () => {
  // Delete entity. Physically, it will exist in database, but
  // search methods will not find it.
  await UsersController.deleteOne({name: 'Vladislav Kibenko'});
  
  // Entity will not be found.
  await UsersController.findOne({name: 'Vladislav Kibenko'});
  
  // Entity will be found as we disabled soft deletion mode for this
  // search.
  await UsersController.findOne(
    {name: 'Vladislav Kibenko'}, 
    {}, 
    {includeDeleted: true}
  );
})();
```

#### Timestamps

When using timestamps, controller works with such fields as
`createdAt: Date` and `updatedAt: Date`. 

Idea is rather simple - when you call `createOne` or `createMany`, 
controller creates entity with predefined `createdAt` and `updatedAt` fields
which are equal to current timestamp. 

The second thing you should know is when you are calling `updateOne`
or `updateMany`, controller will set `updatedAt` field to current
timestamp.

As a result, you will have more useful information about your 
entities.

##### Enabling timestamps

```typescript
import {Controller} from '@kibcode/mongodb-controllers';
import {ObjectId, Collection} from 'mongodb';

// Unlike the soft deletion mode, it is required to pass
// createdAt: Date and updatedAt: Date fields. Otherwise,
// TypeScript should throw an error.
interface IUser {
  _id: ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// ...

// Pass useTimestamps = true to enable timestamps.
class UsersController extends Controller({
  collection: usersCollection,
  useTimestamps: true,
}) { }

(async () => {
  const entity = await UsersController.createOne({name: 'Vladislav Kibenko'});
  
  /*
    Entity will be:
    {
      _id: ObjectId('...'),
      name: 'Vladislav Kibenko',
      createdAt: Date('2021-01-07T21:16:17.888Z')
      updatedAt: Date('2021-01-07T21:16:17.888Z')
    }
  */
})();
```
