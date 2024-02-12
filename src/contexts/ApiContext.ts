import AppApi from "@lib/utilities/api";
import { createContext } from "react";


export interface IApiContext {
  api: AppApi;
}

export const ApiContext = createContext({} as IApiContext);
