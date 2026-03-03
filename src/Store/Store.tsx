import { useState} from "react";
import { createContext } from "react";
import { useContext } from "react";

const StoreContext = createContext<any>(null);
type T = any;
interface typeInterface{
token:string,
setToken:React.SetStateAction<T>
};
export const Store=({children}:any):JSX.Element=>{
    const [token,setToken]=useState<string>("");
    const [toggleDarkMode,setToggleDarkMode]=useState<boolean>(false);

    return <StoreContext.Provider value={{token,setToken,toggleDarkMode,setToggleDarkMode}}>
        {children}
    </StoreContext.Provider>
};
export const useCustom=():typeInterface=>useContext<typeInterface>(StoreContext);