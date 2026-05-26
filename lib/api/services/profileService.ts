import httpClient from '@/lib/api/httpClient'

export interface UpdateProfileRequest {
    name: string
    email: string
    login?: string
}

export interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

const profileService = {
    async getMe() {
        const response = await httpClient.get('/api/users/me')
        return response.data
    },

    async updateProfile(data: UpdateProfileRequest) {
        const response = await httpClient.put('/api/users/me/profile', data)
        return response.data
    },

    async changePassword(userId: number, data: ChangePasswordRequest) {
        await httpClient.post(`/api/users/${userId}/change-password`, data)
    },
}

export default profileService