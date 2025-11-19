import endpoints from '@/api/endpoints'
import type { CreateChatRequest, CreateChatResponse } from '@/api/types/chats'
import { requestHelpers } from '@/lib/request'

type CreateChatApiResponse = { data: CreateChatResponse } | CreateChatResponse

const isWrappedResponse = (
  value: CreateChatApiResponse
): value is { data: CreateChatResponse } => {
  return typeof value === 'object' && value !== null && 'data' in value
}

const createChat = async (
  payload: CreateChatRequest
): Promise<CreateChatResponse> => {
  const formData = new FormData()
  formData.append('name', payload.name)
  payload.participantIds.forEach((friendId) => {
    formData.append(friendId, 'true')
  })

  const response = (await requestHelpers.post<CreateChatApiResponse>(
    endpoints.chat.create,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )) as CreateChatApiResponse

  if (isWrappedResponse(response)) {
    return response.data
  }

  return response
}

export const chatsApi = {
  create: createChat,
}

export type { CreateChatRequest, CreateChatResponse }

export default chatsApi
