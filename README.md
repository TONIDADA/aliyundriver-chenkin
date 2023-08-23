| 参数          | 说明                                             |
| ------------- | ------------------------------------------------ |
| REFRESH_TOKENS  | 阿里云盘 refresh_token, 多个账号需使用 '&' 隔开 |
| PUSHPLUS_TOKEN | pushplus消息推送 申请地址 http://www.pushplus.plus|
| GP_TOKEN | 在 Action 中运行时更新 REFRESH_TOKENS|

> **获取 refresh_token 的方法**
>
>  登录[阿里云盘](https://www.aliyundrive.com/drive)后，可以在`开发者工具(F12)` -> `Application` -> `Local Storage` 中的 `token` 字段对应的JSON中寻找`refresh_token`。

> **获取 GP_TOKEN 的方法**
>
> 点击 GitHub 头像 -> `Settings` (注意与配置 Secrets 不是同一个
> Settings) -> `Developer settings` -> `Personal access token` -> `Tokens(classic)` -> `Generate new token`
>
> 权限选择 `repo`, 不然不能更新 Secrets. 记住生成的 token, 离开页面后无法查看

#### 参考项目
- @mrabit: [mrabit/aliyundriveDailyCheck](https://github.com/mrabit/aliyundriveDailyCheck/)
- @jinchaofs: [jinchaofs/v2free-checkin](https://github.com/jinchaofs/v2free-checkin/)
- @lukesyy: [lukesyy/glados_automation](https://github.com/lukesyy/glados_automation)
