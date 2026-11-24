package com.housing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@SpringBootApplication(excludeName = {
        "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
        "org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration",
        "org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration"
})
@ComponentScan(excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = {
                "com\\.housing\\.domain\\.(favorite|housingcondition|inquiry|notification|region)\\.(controller|service)\\..*",
                "com\\.housing\\.domain\\.policy\\.(controller|service)\\.HousingPolicy.*",
                "com\\.housing\\.domain\\.user\\.service\\.UserService"
        }
))
public class YouthHousingApplication {

    public static void main(String[] args) {
        SpringApplication.run(YouthHousingApplication.class, args);
    }
}
