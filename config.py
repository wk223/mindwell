from pydantic import SecretStr
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):#自动从环境变量和env文件中读取值
    # Database
    database_url: str = "postgresql+asyncpg://mindwell:mindwell_dev@localhost:5432/mindwell"
    database_url_sync: str = "postgresql://mindwell:mindwell_dev@localhost:5432/mindwell"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    #SecretStr 为一种特殊类型打印时显示*防止密钥泄露到日志
    jwt_secret: SecretStr = SecretStr("dev-secret-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    # LLM
    llm_api_key: SecretStr = SecretStr("")
    llm_base_url: str = "https://api.deepseek.com/v1"
    llm_model: str = "deepseek-chat"
    llm_max_tokens: int = 1024
    llm_temperature: float = 0.7

    # App
    app_env: str = "development"
    app_debug: bool = True
    cors_origins: list[str] = ["http://localhost:5173"]
    #pydantic v2的配置方式 "env_file": ".env"告诉它从。env中加载
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

#保证settings()全局只初始化一次
@lru_cache
def get_settings() -> Settings:
    return Settings()

#整体流程 启用时get_settings被调用 pydnatic读取env中的llmapi密钥 自动映射通过
#settings.llm_api_key,后续任何代码调用通过此类型读取真实密钥