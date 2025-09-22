// src/create-trip/components/LoginDialog.jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

function LoginDialog({ open, onGoogleLogin }) {
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center">
            <img src="/logo.svg" alt="Logo" className="h-16 w-auto" />
            <span className="ml-2 text-xl font-bold text-gray-800">
              Travel Rover
            </span>
          </DialogTitle>
          <div className="mt-5">
            <Button
              className="w-full mt-5 flex gap-4 items-center"
              onClick={onGoogleLogin}
            >
              <FcGoogle />
              Sign In With Google
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default LoginDialog;