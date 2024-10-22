import { queryBus, commandBus } from 'missive.js-shared-code-example';

const getUserQuery = queryBus.createQuery('getUser', { email: 'plopix@example.com' });
const { result: user } = await queryBus.query(getUserQuery);

console.log({ user });

const createUserCommand = commandBus.createCommand('createUser', {
    email: 'plopix@example.com',
    firstname: 'Plopix',
    lastname: 'ix',
});
const { result } = await commandBus.submitCommand(createUserCommand);
console.log(result);

const removeUserCommand = commandBus.createCommand('removeUser', { userId: '1234' });
const { result: result2 } = await commandBus.submitCommand(removeUserCommand);

console.log({ result2 });
