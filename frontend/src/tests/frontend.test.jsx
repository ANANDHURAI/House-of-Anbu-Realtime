// src/tests/frontend.test.jsx
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

import LoginPage from "../pages/auth/LoginPage"
import RegisterPage from "../pages/auth/RegisterPage"
import RoomCreationForm from "../components/chat/Sidebar/RoomCreationForm"
import RoomList from "../components/chat/Sidebar/RoomList"
import AxiosInstance from "../api/AxiosInterCepters"
import { MemoryRouter } from "react-router-dom"
import ProtectedRoute from "../components/ProtectedRoute"
import PublicRoute from "../components/PublicRoute"
import Search from "../components/register/Search"
import AddMembersModal from "../components/chat/AddMembersModal"

vi.mock("../api/AxiosInterCepters")



// ==========================================================
// LOGIN PAGE
// ==========================================================
describe("LoginPage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("shows the email input on the first step", () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument()
  })

  it("moves to the OTP step after a successful email submit", async () => {
    AxiosInstance.post.mockResolvedValueOnce({ status: 200 })
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByPlaceholderText("name@example.com"), "test@example.com")
    await user.click(screen.getByText("Send Magic Link"))
    await waitFor(
      () => expect(screen.getByPlaceholderText("· · · ·")).toBeInTheDocument(),
      { timeout: 3000 }
    )
  })
})




// ==========================================================
// REGISTER PAGE
// ==========================================================
describe("RegisterPage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("starts on the name step", () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument()
  })
})




// ==========================================================
// ROOM CREATION FORM
// ==========================================================
describe("RoomCreationForm", () => {
  beforeEach(() => vi.clearAllMocks())

  it("submit button is disabled when input is empty", () => {
    render(<RoomCreationForm onRoomCreated={() => {}} />)
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
  })

  it("creates a room and shows a success message", async () => {
    AxiosInstance.post.mockResolvedValueOnce({ data: { id: 1, name: "Study Group" } })
    const onRoomCreated = vi.fn()
    const user = userEvent.setup()

    render(<RoomCreationForm onRoomCreated={onRoomCreated} />)
    await user.type(screen.getByPlaceholderText("Chat room name..."), "Study Group")
    await user.click(screen.getByRole("button"))

    expect(await screen.findByText(/Room created!/i)).toBeInTheDocument()
    expect(onRoomCreated).toHaveBeenCalledWith({ id: 1, name: "Study Group" })
  })
})



// ==========================================================
// ROOM LIST
// ==========================================================
describe("RoomList", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders nothing when there are no rooms", async () => {
    AxiosInstance.get.mockResolvedValueOnce({ data: [] })
    const { container } = render(<RoomList onSelectRoom={() => {}} />)
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it("renders a room fetched from the API", async () => {
    AxiosInstance.get.mockResolvedValueOnce({
      data: [{ id: 1, name: "Study Group", is_video_room: false, created_by: "John" }],
    })
    render(<RoomList onSelectRoom={() => {}} />)
    expect(await screen.findByText("Study Group")).toBeInTheDocument()
  })
})



// ==========================================================
// PROTECTED ROUTE
// ==========================================================
describe("ProtectedRoute", () => {
  afterEach(() => localStorage.clear())

  it("redirects to login when there is no access token", () => {
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <ProtectedRoute><div>Secret Page</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.queryByText("Secret Page")).not.toBeInTheDocument()
  })

  it("shows the page when an access token exists", () => {
    localStorage.setItem("access", "fake-token")
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <ProtectedRoute><div>Secret Page</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByText("Secret Page")).toBeInTheDocument()
  })
})




// ==========================================================
// PUBLIC ROUTE
// ==========================================================
describe("PublicRoute", () => {
  afterEach(() => localStorage.clear())

  it("shows the page when there is no access token", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <PublicRoute><div>Login Form</div></PublicRoute>
      </MemoryRouter>
    )
    expect(screen.getByText("Login Form")).toBeInTheDocument()
  })

  it("redirects away when an access token already exists", () => {
    localStorage.setItem("access", "fake-token")
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <PublicRoute><div>Login Form</div></PublicRoute>
      </MemoryRouter>
    )
    expect(screen.queryByText("Login Form")).not.toBeInTheDocument()
  })
})





// ==========================================================
// SEARCH (debounce)
// ==========================================================
describe("Search", () => {
  beforeEach(() => vi.clearAllMocks())

  it("does not search immediately while typing", async () => {
    const user = userEvent.setup()
    render(<Search onSelectChat={() => {}} />)
    await user.type(screen.getByPlaceholderText("Search contacts..."), "Bo")
    // debounce hasn't fired yet, so no request should be sent
    expect(AxiosInstance.post).not.toHaveBeenCalled()
  })

  it("searches after the debounce delay and shows a result", async () => {
    AxiosInstance.post.mockResolvedValueOnce({
      data: { results: [{ id: 1, name: "Bob", email: "bob@example.com" }] },
    })
    const user = userEvent.setup()
    render(<Search onSelectChat={() => {}} />)
    await user.type(screen.getByPlaceholderText("Search contacts..."), "Bob")

    // useDebounce waits 500ms before firing the request
    expect(await screen.findByText("Bob")).toBeInTheDocument()
  })
})




// ==========================================================
// ADD MEMBERS MODAL
// ==========================================================
describe("AddMembersModal", () => {
  beforeEach(() => vi.clearAllMocks())

  it("add button is disabled until a user is selected", async () => {
    AxiosInstance.post.mockResolvedValueOnce({
      data: { results: [{ id: 2, name: "Alice", email: "alice@example.com" }] },
    })
    const user = userEvent.setup()
    render(<AddMembersModal room={{ id: 5 }} onClose={() => {}} />)

    const addButton = screen.getByText(/Add Members/i, { selector: "button" })
    expect(addButton).toBeDisabled()

    await user.type(screen.getByPlaceholderText("Search users to add..."), "Alice")
    const userRow = await screen.findByText("Alice")
    await user.click(userRow)

    expect(addButton).not.toBeDisabled()
  })

  it("calls onClose after successfully adding a member", async () => {
    AxiosInstance.post
      .mockResolvedValueOnce({ data: { results: [{ id: 2, name: "Alice", email: "alice@example.com" }] } })
      .mockResolvedValueOnce({ data: { message: "Participants added successfully!" } })
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(<AddMembersModal room={{ id: 5 }} onClose={onClose} />)
    await user.type(screen.getByPlaceholderText("Search users to add..."), "Alice")
    await user.click(await screen.findByText("Alice"))
    await user.click(screen.getByText(/Add Members/i, { selector: "button" }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})