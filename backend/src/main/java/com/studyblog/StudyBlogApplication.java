package com.studyblog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StudyBlogApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudyBlogApplication.class, args);
    }
}
