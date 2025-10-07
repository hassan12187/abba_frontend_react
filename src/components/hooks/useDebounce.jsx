import { useCallback, useRef } from "react";

export const useDebounce=(callback,delay)=>{
    const timer=useRef();
    const debounce=useCallback(
        (...args)=>{
            clearTimeout(timer.current);
            timer.current=setTimeout(()=>{
                callback(...args);
            },delay);
        },[callback,delay]
    );
    return debounce;
};