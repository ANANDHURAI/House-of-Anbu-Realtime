import axios from "axios";

const BASEURL = "http://127.0.0.1:8000";

const AxiosInstance = axios.create({
  baseURL: BASEURL,
});

// Add a request interceptor

AxiosInstance.interceptors.request.use(
  (config) => {
    const noAuthUrls = [
      "/auth/register/",
      "/auth/verify-otp/",
      "/auth/login/",
      "/auth/login/verify-otp/"
    ];
    const needsAuth = !noAuthUrls.some((url) => config.url.includes(url));

    if (needsAuth) {
      const accessToken = localStorage.getItem("access");
      if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// Add a response interceptor
AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      console.warn("Token expired or unauthorized, attempting refresh...");

      try {
        const refreshToken = localStorage.getItem("refresh");
        if (!refreshToken) throw new Error("No refresh token found");

        const refreshResponse = await axios.post(
          `${BASEURL}/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const newAccessToken = refreshResponse.data.access;
        localStorage.setItem("access", newAccessToken);

 
        if (refreshResponse.data.refresh) {
          localStorage.setItem("refresh", refreshResponse.data.refresh);
        }

        // retry original request with new token
        const originalRequest = error.config;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return await axios(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Instead of navigate(), just clear tokens
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login"; // Redirect manually
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default AxiosInstance;
