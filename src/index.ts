import {IController} from './Controller/types';

export * from './Controller';
export * from './types';

type TTest = IController<{_id: string}, false, false>;