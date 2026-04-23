import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-sky-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-2xl bg-white p-8 shadow-md">
          <h1 className="text-3xl font-black text-slate-900">My Profile</h1>
          <p className="mt-2 text-slate-500">Manage your account details</p>

          <div className="mt-8 space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Username</p>
              <p className="mt-1 text-lg text-slate-900">
                {user?.username || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">Email</p>
              <p className="mt-1 text-lg text-slate-900">
                {user?.email || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">Role</p>
              <p className="mt-1 text-lg capitalize text-slate-900">
                {user?.role || "buyer"}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-8 rounded-md bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3 font-semibold text-white hover:opacity-95"
          >
            Logout
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}