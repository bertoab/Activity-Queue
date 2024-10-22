import { Model } from "./modules/Model.js";
import { ViewModel } from "./modules/ViewModel.js";
import { View } from "./modules/View.js";

const m = Model();
const vm = ViewModel(m);
const v = View(vm);