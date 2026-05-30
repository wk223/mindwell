import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://121.4.44.210",   // 远程服务器 API（本地开发无需 Docker）
        changeOrigin: true,
      },
    },
  },
});
