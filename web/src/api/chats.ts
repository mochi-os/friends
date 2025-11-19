import endpoints from '@/api/endpoints'
import type { CreateChatRequest, CreateChatResponse } from '@/api/types/chats'
import { requestHelpers } from '@/lib/request'

const createChat = async (payload: CreateChatRequest) => {
  const formData = new FormData()
  formData.append('name', payload.name)
  payload.participantIds.forEach((friendId) => {
    formData.append(friendId, 'true')
  })

  const response = await requestHelpers.post<
    { data: CreateChatResponse } | CreateChatResponse
  >(endpoints.chat.create, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return 'data' in response ? response.data : response
}

export const chatsApi = {
  create: createChat,
}

export type { CreateChatRequest, CreateChatResponse }

export default chatsApi
