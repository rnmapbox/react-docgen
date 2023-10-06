import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

export const MyComponent =
memo(forwardRef((_, ref) => {

  const _myMethod = useCallback((argument:string) : number => {},[]);
  //const _myMethod = (argument:string) : number => {};
  
  useImperativeHandle(
    ref,
    () => ({
        /** myMethod description */
        _myMethod,
    }),
    [],
  );

  return <div />;
}));