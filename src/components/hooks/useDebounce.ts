import React, { useCallback, useRef } from "react";

export const useDebounce=(callback:Function,delay:number)=>{
    const timer:any=useRef();
    
    const debounce=useCallback(
        (...args:any[])=>{
            clearTimeout(timer.current);
            timer.current=setTimeout(()=>{
                callback(...args);
            },delay);
        },[callback,delay]
    );
    return debounce;
};