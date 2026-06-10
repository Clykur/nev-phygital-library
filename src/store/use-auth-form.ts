import { create } from "zustand";

interface AuthFormState {
  // Common
  authTab: "login" | "signup";
  collegeAuthTab: "login" | "signup";

  // Student Login
  loginEmail: string;
  loginPassword: string;

  // Student Sign Up
  signUpName: string;
  signUpEmail: string;
  signUpPhone: string;
  signUpPassword: string;
  signUpBranch: string;
  signUpPremium: boolean;

  // Hub Login
  collegeEmail: string;
  collegePassword: string;
  collegeName: string;
  collegeBranch: string;

  // Hub Sign Up (Admin/Institution info)
  adminName: string;
  adminEmail: string;
  phone: string;
  designation: string;
  institutionName: string;
  institutionType: string;
  country: string;
  adminState: string;
  city: string;
  district: string;
  address: string;
  postalCode: string;
  adminRole: string;
  password: string;
  confirmPassword: string;

  // Setters
  setAuthTab: (tab: "login" | "signup") => void;
  setCollegeAuthTab: (tab: "login" | "signup") => void;

  setLoginEmail: (val: string) => void;
  setLoginPassword: (val: string) => void;

  setSignUpName: (val: string) => void;
  setSignUpEmail: (val: string) => void;
  setSignUpPhone: (val: string) => void;
  setSignUpPassword: (val: string) => void;
  setSignUpBranch: (val: string) => void;
  setSignUpPremium: (val: boolean) => void;

  setCollegeEmail: (val: string) => void;
  setCollegePassword: (val: string) => void;
  setCollegeName: (val: string) => void;
  setCollegeBranch: (val: string) => void;

  setAdminName: (val: string) => void;
  setAdminEmail: (val: string) => void;
  setPhone: (val: string) => void;
  setDesignation: (val: string) => void;
  setInstitutionName: (val: string) => void;
  setInstitutionType: (val: string) => void;
  setCountry: (val: string) => void;
  setAdminState: (val: string) => void;
  setCity: (val: string) => void;
  setDistrict: (val: string) => void;
  setAddress: (val: string) => void;
  setPostalCode: (val: string) => void;
  setAdminRole: (val: string) => void;
  setPassword: (val: string) => void;
  setConfirmPassword: (val: string) => void;

  // Optional: A generic updater
  updateField: <K extends keyof AuthFormState>(field: K, value: AuthFormState[K]) => void;
}

export const useAuthFormStore = create<AuthFormState>((set) => ({
  authTab: "login",
  collegeAuthTab: "login",

  loginEmail: "",
  loginPassword: "",

  signUpName: "",
  signUpEmail: "",
  signUpPhone: "",
  signUpPassword: "",
  signUpBranch: "RVCE-BLR",
  signUpPremium: false,

  collegeEmail: "",
  collegePassword: "",
  collegeName: "",
  collegeBranch: "RVCE-BLR",

  adminName: "",
  adminEmail: "",
  phone: "",
  designation: "",
  institutionName: "",
  institutionType: "college",
  country: "India",
  adminState: "",
  city: "",
  district: "",
  address: "",
  postalCode: "",
  adminRole: "hub",
  password: "",
  confirmPassword: "",

  setAuthTab: (tab) => set({ authTab: tab }),
  setCollegeAuthTab: (tab) => set({ collegeAuthTab: tab }),

  setLoginEmail: (val) => set({ loginEmail: val }),
  setLoginPassword: (val) => set({ loginPassword: val }),

  setSignUpName: (val) => set({ signUpName: val }),
  setSignUpEmail: (val) => set({ signUpEmail: val }),
  setSignUpPhone: (val) => set({ signUpPhone: val }),
  setSignUpPassword: (val) => set({ signUpPassword: val }),
  setSignUpBranch: (val) => set({ signUpBranch: val }),
  setSignUpPremium: (val) => set({ signUpPremium: val }),

  setCollegeEmail: (val) => set({ collegeEmail: val }),
  setCollegePassword: (val) => set({ collegePassword: val }),
  setCollegeName: (val) => set({ collegeName: val }),
  setCollegeBranch: (val) => set({ collegeBranch: val }),

  setAdminName: (val) => set({ adminName: val }),
  setAdminEmail: (val) => set({ adminEmail: val }),
  setPhone: (val) => set({ phone: val }),
  setDesignation: (val) => set({ designation: val }),
  setInstitutionName: (val) => set({ institutionName: val }),
  setInstitutionType: (val) => set({ institutionType: val }),
  setCountry: (val) => set({ country: val }),
  setAdminState: (val) => set({ adminState: val }),
  setCity: (val) => set({ city: val }),
  setDistrict: (val) => set({ district: val }),
  setAddress: (val) => set({ address: val }),
  setPostalCode: (val) => set({ postalCode: val }),
  setAdminRole: (val) => set({ adminRole: val }),
  setPassword: (val) => set({ password: val }),
  setConfirmPassword: (val) => set({ confirmPassword: val }),

  updateField: (field, value) => set({ [field]: value }),
}));
