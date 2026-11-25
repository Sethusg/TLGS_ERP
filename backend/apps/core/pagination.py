"""Pagination and standardized JSON exception handling for LEADERS ERP API."""
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import exception_handler


class ErpStandardPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 200


def erp_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            "success": False,
            "status_code": response.status_code,
            "errors": response.data,
        }
    return response
