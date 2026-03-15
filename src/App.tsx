import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { AuthProvider } from "@/hooks/useAuth";
import { router } from "@/router";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
        <Toaster />
        <RouterProvider router={router} />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
