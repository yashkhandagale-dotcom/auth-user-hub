import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users-api';
import { handleApiError } from '@/lib/api/error-handler';
import { toast } from 'sonner';

export const useUsers = () => {
  const queryClient = useQueryClient();

  // Fetch all users
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
    staleTime: 30000, // 30 seconds
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  return {
    // Queries
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error,

    // Mutations
    deleteUser: deleteMutation.mutate,

    // Mutation states
    isDeleting: deleteMutation.isPending,

    // Refetch
    refetch: usersQuery.refetch,
  };
};
