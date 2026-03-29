package com.mirrorv.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Mirror-V 后端主启动类
 * 开启 JPA 审计功能以支持自动生成时间戳
 */
@SpringBootApplication
@EnableJpaAuditing
public class MirrorVApplication {
    public static void main(String[] args) {
        SpringApplication.run(MirrorVApplication.class, args);
    }
}
