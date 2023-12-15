import { useForm } from "react-hook-form";
import { Button } from "../components/button";
import { NavLink, useNavigate } from "react-router-dom";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { icons } from "../utils/constants";
import InputAuth from "../components/input/InputAuth";
import { Label } from "../components/label";
import { Field } from "../components/field";
import { useEffect } from "react";
import { toast } from "react-toastify";

const schema = yup.object({
  fullname: yup.string().required("Please enter your fullname"),
  email: yup
    .string()
    .email("Please enter valid email address")
    .required("Please enter your email address"),
  password: yup
    .string()
    .min(8, "Your password must be at least 8 characters or greater")
    .required("Please enter your password"),
});

const SignUpPage = () => {
  const navigate = useNavigate();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    const arrError = Object.values(errors);
    if (arrError.length > 0) {
      toast.error(arrError[0]?.message, {
        pauseOnHover: false,
        delay: 0,
      });
    }
  }, [errors]);

  const handleSignUp = (values) => {
    if (!isValid) return;
    console.log("values:", values);
  };

  return (
    <div>
      <form
        className="max-w-lg w-full mx-auto"
        onSubmit={handleSubmit(handleSignUp)}
        autoComplete="off"
      >
        <Field>
          <Label htmlFor="fullname">Fullname</Label>
          <InputAuth
            type="text"
            name="fullname"
            placeholder="Enter your fullname"
            control={control}
          />
        </Field>
        <Field>
          <Label htmlFor="email">Email address</Label>
          <InputAuth
            type="email"
            name="email"
            placeholder="Enter your email"
            control={control}
          />
        </Field>
        <Field>
          <Label htmlFor="password">Password</Label>
          <InputAuth
            type="password"
            name="password"
            placeholder="Enter your password"
            control={control}
          />
        </Field>
        <div className="have-account">
          You already have an account? <NavLink to={"/sign-in"}>Login</NavLink>{" "}
        </div>
        <div className="flex items-center gap-3 mt-5 justify-center">
          <Button
            type="submit"
            className="w-full max-w-[300px] mx-auto"
            width="150px"
            height="45px"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Sign Up
          </Button>
          <p className="text-lg font-semibold text-gray-400">or</p>
          <Button
            type="button"
            height="45px"
            to={"http://localhost:8080/api/v1/auth/google"}
          >
            {icons.googleIcon} <span className="ml-2">Sign up with Google</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SignUpPage;